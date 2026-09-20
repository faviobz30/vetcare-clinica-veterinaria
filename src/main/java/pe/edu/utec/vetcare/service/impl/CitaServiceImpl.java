package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.utec.vetcare.dto.request.CreateCitaRequest;
import pe.edu.utec.vetcare.dto.request.UpdateCitaRequest;
import pe.edu.utec.vetcare.dto.response.CitaResponse;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;
import pe.edu.utec.vetcare.exception.CitaHorarioOcupadoException;
import pe.edu.utec.vetcare.exception.EstadoCitaInvalidoException;
import pe.edu.utec.vetcare.mapper.CitaMapper;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.CitaService;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepository;
    private final VeterinarioRepository veterinarioRepository;
    private final CitaMapper citaMapper;

    public CitaServiceImpl(
            CitaRepository citaRepository,
            VeterinarioRepository veterinarioRepository,
            CitaMapper citaMapper
    ) {
        this.citaRepository = citaRepository;
        this.veterinarioRepository = veterinarioRepository;
        this.citaMapper = citaMapper;
    }

    @Override
    public List<CitaResponse> getAll() {
        return citaRepository.findAll()
                .stream()
                .map(citaMapper::toResponse)
                .toList();
    }

    @Override
    public CitaResponse getById(Long id) {
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Cita no encontrada"));
        return citaMapper.toResponse(entity);
    }

    @Override
    public CitaResponse create(CreateCitaRequest request) {
        VeterinarioEntity veterinario = veterinarioRepository
                .findById(request.getIdVeterinario())
                .orElseThrow(() -> new RuntimeException("Veterinario no encontrado"));

        LocalDateTime inicioComparacion = request.getFechaCita().minusMinutes(30);

        LocalDateTime finNuevaCita = request.getFechaCita().plusMinutes(30);

        boolean existeCita = citaRepository.existsCitaSuperpuesta(
                request.getIdVeterinario(),
                inicioComparacion,
                finNuevaCita);

        if (existeCita) {
            throw new CitaHorarioOcupadoException(
                    "El veterinario ya tiene una cita que se cruza con ese horario");}

        CitaEntity entity = citaMapper.toEntity(request);

        entity.setVeterinario(veterinario);
        entity.setEstado(EstadoCita.PENDIENTE);

        CitaEntity savedEntity = citaRepository.save(entity);

        return citaMapper.toResponse(savedEntity);
    }

    @Override
    public CitaResponse update(
            Long id,
            UpdateCitaRequest request) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        LocalDateTime inicioComparacion = request.getFechaCita().minusMinutes(30);

        LocalDateTime finNuevaCita = request.getFechaCita().plusMinutes(30);

        boolean existeCita = citaRepository.existsCitaSuperpuesta(
                entity.getVeterinario().getIdVeterinario(),
                inicioComparacion,
                finNuevaCita);

        if (existeCita && !entity.getFechaCita().equals(request.getFechaCita())) {
            throw new CitaHorarioOcupadoException(
                    "El veterinario ya tiene una cita que se cruza con ese horario");}

        citaMapper.updateEntity(request, entity);

        CitaEntity updatedEntity = citaRepository.save(entity);

        return citaMapper.toResponse(updatedEntity);
    }

    @Override
    public void delete(Long id) {
        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));
        citaRepository.delete(entity);
    }

    @Override
    public CitaResponse confirm(Long id) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (entity.getEstado() != EstadoCita.PENDIENTE) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede confirmar una cita que esté PENDIENTE");}

        entity.setEstado(EstadoCita.CONFIRMADA);

        CitaEntity updatedEntity = citaRepository.save(entity);

        return citaMapper.toResponse(updatedEntity);
    }

    @Override
    public CitaResponse cancel(Long id) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (entity.getEstado() != EstadoCita.PENDIENTE
                && entity.getEstado() != EstadoCita.CONFIRMADA) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede cancelar una cita PENDIENTE o CONFIRMADA");}

        entity.setEstado(EstadoCita.CANCELADA);

        CitaEntity updatedEntity = citaRepository.save(entity);

        return citaMapper.toResponse(updatedEntity);
    }

    @Override
    public CitaResponse attend(Long id) {

        CitaEntity entity = citaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        if (entity.getEstado() != EstadoCita.CONFIRMADA) {
            throw new EstadoCitaInvalidoException(
                    "Solo se puede marcar como ATENDIDA una cita CONFIRMADA");}

        entity.setEstado(EstadoCita.ATENDIDA);

        CitaEntity updatedEntity = citaRepository.save(entity);

        return citaMapper.toResponse(updatedEntity);
    }

}