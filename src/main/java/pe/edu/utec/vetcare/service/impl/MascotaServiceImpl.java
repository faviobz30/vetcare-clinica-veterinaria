package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.MascotaRequest;
import pe.edu.utec.vetcare.dto.response.MascotaResponse;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;
import pe.edu.utec.vetcare.entity.MascotaEntity;
import pe.edu.utec.vetcare.entity.PropietarioEntity;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.MascotaMapper;
import pe.edu.utec.vetcare.repository.HistoriaClinicaRepository;
import pe.edu.utec.vetcare.repository.MascotaRepository;
import pe.edu.utec.vetcare.repository.PropietarioRepository;
import pe.edu.utec.vetcare.service.MascotaService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MascotaServiceImpl implements MascotaService {

    private final MascotaRepository mascotaRepository;
    private final PropietarioRepository propietarioRepository;
    private final HistoriaClinicaRepository historiaClinicaRepository;
    private final MascotaMapper mascotaMapper;

    @Override
    @Transactional(readOnly = true)
    public List<MascotaResponse> listar() {

        return mascotaRepository.findAll()
                .stream()
                .map(mascotaMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MascotaResponse obtener(Long id) {
        return mascotaMapper.toResponse(buscarMascota(id));
    }

    @Override
    @Transactional
    public MascotaResponse crear(MascotaRequest request) {

        PropietarioEntity propietario = propietarioRepository
                        .findById(request.getIdPropietario())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                        "Propietario no encontrado"));

        MascotaEntity mascota = mascotaMapper.toEntity(request);

        mascota.setPropietario(propietario);

        MascotaEntity mascotaGuardada = mascotaRepository.save(mascota);

        HistoriaClinicaEntity historia = new HistoriaClinicaEntity();

        historia.setMascota(mascotaGuardada);

        historiaClinicaRepository.save(historia);

        return mascotaMapper.toResponse(mascotaGuardada);
    }

    @Override
    @Transactional
    public MascotaResponse actualizar(Long id, MascotaRequest request) {

        MascotaEntity mascota = buscarMascota(id);

        PropietarioEntity propietario = propietarioRepository
                        .findById(request.getIdPropietario())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                        "Propietario no encontrado"));

        mascotaMapper.updateEntity(request, mascota);

        mascota.setPropietario(propietario);

        return mascotaMapper.toResponse(
                mascotaRepository.save(mascota)
        );
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        MascotaEntity mascota = buscarMascota(id);
        mascotaRepository.delete(mascota);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MascotaResponse>
    listarPorPropietario(Long idPropietario) {

        return mascotaRepository
                .findByPropietarioIdPropietario(
                        idPropietario
                )
                .stream()
                .map(mascotaMapper::toResponse)
                .toList();
    }

    private MascotaEntity buscarMascota(Long id) {

        return mascotaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mascota no encontrada"));
    }
}