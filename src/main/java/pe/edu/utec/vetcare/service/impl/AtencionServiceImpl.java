package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.utec.vetcare.dto.request.CreateAtencionRequest;
import pe.edu.utec.vetcare.dto.request.UpdateAtencionRequest;
import pe.edu.utec.vetcare.dto.response.AtencionResponse;
import pe.edu.utec.vetcare.entity.AtencionEntity;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;
import pe.edu.utec.vetcare.exception.AtencionNoEncontradaException;
import pe.edu.utec.vetcare.exception.EstadoCitaInvalidoException;
import pe.edu.utec.vetcare.mapper.AtencionMapper;
import pe.edu.utec.vetcare.repository.AtencionRepository;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.AtencionService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AtencionServiceImpl implements AtencionService {

    private final AtencionRepository atencionRepository;
    private final CitaRepository citaRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final AtencionMapper atencionMapper;

    public AtencionServiceImpl(
            AtencionRepository atencionRepository,
            CitaRepository citaRepository,
            VeterinarioRepository veterinarioRepository,
            AtencionMapper atencionMapper
    ) {
        this.atencionRepository = atencionRepository;
        this.citaRepository = citaRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.atencionMapper = atencionMapper;
    }

    @Override
    public List<AtencionResponse> getAll() {
        return atencionRepository.findAll()
                .stream()
                .map(atencionMapper::toResponse)
                .toList();
    }

    @Override
    public AtencionResponse getById(Integer id) {
        AtencionEntity entity = atencionRepository.findById(id)
                .orElseThrow(() -> new AtencionNoEncontradaException("Atención no encontrada"));
        return atencionMapper.toResponse(entity);
    }

    @Override
    public AtencionResponse create(CreateAtencionRequest request) {
        CitaEntity cita = citaRepository.findById(request.getIdCita())
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (cita.getEstado() != EstadoCita.ATENDIDA) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede registrar una atención para una cita ATENDIDA");
        }

        VeterinarioEntity veterinario = veterinarioRepository.findById(request.getIdVeterinario())
                        .orElseThrow(() -> new RuntimeException("Veterinario no encontrado"));

        boolean existeAtencion = atencionRepository.existsByCita_IdCita(request.getIdCita());

        if (existeAtencion) {
            throw new EstadoCitaInvalidoException("La cita ya tiene una atención registrada");
        }

        AtencionEntity entity = new AtencionEntity();

        entity.setIdHistoria(request.getIdHistoria());
        entity.setVeterinario(veterinario);
        entity.setCita(cita);
        entity.setFechaAtencion(LocalDateTime.now());
        entity.setPrecioAtencion(request.getPrecioAtencion());
        entity.setPeso(request.getPeso());
        entity.setSintoma(request.getSintoma());
        entity.setDiagnostico(request.getDiagnostico());
        entity.setTratamiento(request.getTratamiento());
        entity.setObservacion(request.getObservacion());

        AtencionEntity savedEntity = atencionRepository.save(entity);

        return atencionMapper.toResponse(savedEntity);
    }

    @Override
    public AtencionResponse update(
            Integer id,
            UpdateAtencionRequest request) {
        AtencionEntity entity = atencionRepository.findById(id)
                .orElseThrow(() -> new AtencionNoEncontradaException("Atención no encontrada"));

        atencionMapper.updateEntity(request, entity);
        AtencionEntity updatedEntity = atencionRepository.save(entity);
        return atencionMapper.toResponse(updatedEntity);
    }

    @Override
    public void delete(Integer id) {
        AtencionEntity entity = atencionRepository.findById(id)
                .orElseThrow(() -> new AtencionNoEncontradaException("Atención no encontrada"));

        atencionRepository.delete(entity);
    }
}